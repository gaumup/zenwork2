<?php
    sleep(5);
    echo json_encode( array(
        'milestones' => array(
            array(
                'id' => 'M-1234',
                'name' => 'Milestone 1: Do the right job',
                'dueDate' => '31-09-2015',
                'effort' => 2,
                'status' => 0,
                'deliverables' => array(
                    array(
                        'id' => 'M-1234',
                        'name' => 'Delivery 1: Do the right job',
                        'dueDate' => '31-09-2015',
                        'effort' => 2,
                        'status' => 0,
                        'tasks' => 4
                    ),
                    array(
                        'id' => 'M-2345',
                        'name' => 'Delivery 2: Shift the good product',
                        'dueDate' => '12-10-2015',
                        'effort' => 2,
                        'status' => 0,
                        'tasks' => 4
                    ),
                    array(
                        'id' => 'M-3456',
                        'name' => 'Delivery 3: Manage all thing in one place',
                        'dueDate' => '01-11-2015',
                        'effort' => 2,
                        'status' => 0,
                        'tasks' => 4
                    )
                )
            )
        )
    ) );